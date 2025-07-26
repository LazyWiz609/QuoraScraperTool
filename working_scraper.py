import os
import time
import argparse
import pickle
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

BACKEND_API_URL = "http://127.0.0.1:5000/api/jobs/{job_id}/questions"
USER_ID = 1
COOKIE_PATH = "quora_cookies.pkl"

# def connect_browser():
#     brave_paths = [
#         r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
#         r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe"
#     ]
#     brave_path = next((p for p in brave_paths if os.path.exists(p)), None)
#     if not brave_path:
#         raise Exception("Brave browser not found.")

#     options = Options()
#     options.binary_location = brave_path
#     options.add_argument("--start-maximized")
#     options.add_argument("--disable-popup-blocking")
#     options.add_experimental_option("detach", True)

#     driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
#     return driver
def connect_browser():
    brave_paths = [
        r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
        r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe"
    ]
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    ]
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]

    binary_path = None
    browser_name = None

    for name, paths in [("Brave", brave_paths), ("Chrome", chrome_paths), ("Edge", edge_paths)]:
        binary_path = next((p for p in paths if os.path.exists(p)), None)
        if binary_path:
            browser_name = name
            break

    if not binary_path:
        raise Exception("No supported browser found (Brave, Chrome, or Edge).")

    options = Options()
    options.binary_location = binary_path
    options.add_argument("--start-maximized")
    options.add_argument("--disable-popup-blocking")
    options.add_experimental_option("detach", True)

    print(f"Launching browser: {browser_name}")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    return driver

def save_cookies(driver, path):
    with open(path, "wb") as file:
        pickle.dump(driver.get_cookies(), file)

def load_cookies(driver, path):
    with open(path, "rb") as file:
        cookies = pickle.load(file)
        for cookie in cookies:
            driver.add_cookie(cookie)

def is_login_required(driver):
    try:
        driver.find_element(By.NAME, "email")
        return True
    except NoSuchElementException:
        return False

def perform_login(driver, email, password):
    print("Logging into Quora...")
    driver.get("https://www.quora.com/")
    time.sleep(3)

    try:
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        email_input.send_keys(email)
        password_input.send_keys(password)
        print("Autofilled email and password. Please click login manually (solve CAPTCHA if needed).")
    except NoSuchElementException:
        print("Email/password fields not found. Skipping autofill...")

    for i in range(60):
        if not is_login_required(driver):
            print("Login successful!")
            return True
        print(f"Waiting for login... ({i * 5}s)")
        time.sleep(5)

    print("Login timeout.")
    return False

def extract_question_links(driver, limit):
    seen = set()
    questions = []
    stagnant_rounds = 0

    print("Collecting questions...")
    while len(questions) < limit and stagnant_rounds < 3:
        previous = len(questions)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)

        links = driver.find_elements(By.XPATH, '//a[contains(@href, "/")]')
        for a in links:
            try:
                href = a.get_attribute("href")
                text = a.text.strip()
                if (
                    text and len(text.split()) > 4 and
                    "quora.com/" in href and
                    "/profile/" not in href and "/topic/" not in href and "/answer" not in href and
                    href.count("/") == 3 and href not in seen
                ):
                    seen.add(href)
                    questions.append({ "question": text, "link": href })
                    if len(questions) >= limit:
                        break
            except:
                continue

        if len(questions) == previous:
            stagnant_rounds += 1
        else:
            stagnant_rounds = 0

        print(f"Collected: {len(questions)}")

    return questions

def questions_by_keyword(keyword, limit, job_id, time_filter=None, email=None, password=None):
    driver = connect_browser()

    driver.get("https://www.quora.com/")
    if os.path.exists(COOKIE_PATH):
        print("Found cookie. Attempting auto-login...")
        load_cookies(driver, COOKIE_PATH)
        driver.get("https://www.quora.com/")
        time.sleep(3)

        if is_login_required(driver):
            print("Cookies expired. Manual login needed.")
            if not perform_login(driver, email, password):
                driver.quit()
                return
            save_cookies(driver, COOKIE_PATH)
    else:
        print("No cookies found. Logging in fresh.")
        if not perform_login(driver, email, password):
            driver.quit()
            return
        save_cookies(driver, COOKIE_PATH)

    # Search
    print(f"Searching for: {keyword}")
    search_url = f"https://www.quora.com/search?q={keyword.replace(' ', '+')}&type=question"
    if time_filter and time_filter.lower() != "all-time":
        search_url += f"&time={time_filter}"

    driver.get(search_url)
    time.sleep(3)
    results = extract_question_links(driver, limit)
    driver.quit()

    print(f"Sending {len(results)} questions to backend...")
    try:
        res = requests.post(
            BACKEND_API_URL.format(job_id=job_id),
            json={ "questions": results, "userId": USER_ID }
        )
        res.raise_for_status()
        print("Questions sent successfully.")
    except Exception as e:
        print("Failed to send questions:", e)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--keyword", required=True)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--time", choices=["day", "week", "month", "year"])
    parser.add_argument("--job-id", type=int, required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    questions_by_keyword(
        args.keyword,
        args.limit,
        args.job_id,
        args.time,
        args.email,
        args.password
    )

if __name__ == "__main__":
    main()
