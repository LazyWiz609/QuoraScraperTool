# __main__.py

import os
import time
import argparse
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup
import userpaths

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException

# -----------------------------------------------
def connect_chrome():
    options = Options()
    # Comment out --headless so you can log in manually
    # options.add_argument("--headless")
    options.add_argument("--incognito")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(options=options)
    driver.maximize_window()
    return driver

# -----------------------------------------------
def is_login_screen_present(browser):
    try:
        browser.find_element(By.XPATH, "//div[contains(text(), 'Continue with Google') or contains(text(), 'Login')]")
        return True
    except NoSuchElementException:
        return False

# -----------------------------------------------
# def extract_question_links_live(browser, limit):
    seen = set()
    question_links = []

    print(" Scrolling and collecting...")
    while len(question_links) < limit:
        # Scroll to bottom
        browser.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)

        anchors = browser.find_elements(By.XPATH, '//a[contains(@href, "/")]')

        for a in anchors:
            try:
                href = a.get_attribute("href")
                text = a.text.strip()

                if not text or len(text.split()) < 4:
                    continue

                if (
                    "quora.com/" in href and
                    "/profile/" not in href and
                    "/topic/" not in href and
                    "/answer" not in href and
                    href.count("/") == 3 and
                    href not in seen
                ):
                    seen.add(href)
                    question_links.append(href)

                if len(question_links) >= limit:
                    break

            except:
                continue

        print(f" Collected {len(question_links)} so far...")

    return question_links[:limit]
def extract_question_links_live(browser, limit):
    seen = set()
    question_links = []

    print(" Scrolling and collecting...")
    
    no_new_results_count = 0
    max_no_new_rounds = 3  # how many times we tolerate not getting new links

    while len(question_links) < limit and no_new_results_count < max_no_new_rounds:
        prev_count = len(question_links)

        # Scroll to bottom
        browser.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)

        anchors = browser.find_elements(By.XPATH, '//a[contains(@href, "/")]')

        for a in anchors:
            try:
                href = a.get_attribute("href")
                text = a.text.strip()

                if not text or len(text.split()) < 4:
                    continue

                if (
                    "quora.com/" in href and
                    "/profile/" not in href and
                    "/topic/" not in href and
                    "/answer" not in href and
                    href.count("/") == 3 and
                    href not in seen
                ):
                    seen.add(href)
                    question_links.append(href)

                    if len(question_links) >= limit:
                        break
            except:
                continue

        print(f" Collected {len(question_links)} so far...")

        if len(question_links) == prev_count:
            no_new_results_count += 1
        else:
            no_new_results_count = 0  # reset if new results found

    return question_links[:limit]

# -----------------------------------------------
def questions_by_keyword(keyword, limit, save_path, time_filter=None):
    browser = connect_chrome()

    # Step 1: Open homepage and wait for manual login
    browser.get("https://www.quora.com/")
    print(" Please log in to Quora manually in the browser window...")

    max_wait_time = 300
    poll_interval = 5
    elapsed = 0
    while elapsed < max_wait_time:
        if not is_login_screen_present(browser):
            print(" Login detected. Proceeding...")
            break
        print(f" Still on login screen... ({elapsed}/{max_wait_time})")
        time.sleep(poll_interval)
        elapsed += poll_interval
    else:
        print(" Login not detected. Exiting...")
        browser.quit()
        return

    # Step 2: Navigate to search
    print(f"Searching for '{keyword}' on Quora...")

    search_url = f"https://www.quora.com/search?q={keyword.replace(' ', '+')}&type=question"

    if time_filter and time_filter.lower() != "all-time":
        search_url += f"&time={time_filter}"

    browser.get(search_url)
    time.sleep(3)
    
    # Step 3: Collect question links
    question_links = extract_question_links_live(browser, limit)

    # Step 4: Save to file
    save_file = Path(save_path) / f"{keyword}_question_urls.txt"
    with open(save_file, "w", encoding="utf-8") as f:
        for link in question_links:
            f.write(link + "\n")

    print(f"\n Found and saved {len(question_links)} questions to {save_file}")
    browser.quit()

# -----------------------------------------------
def main():
    start_time = datetime.now()

    parser = argparse.ArgumentParser(description="Quora Scraper")
    parser.add_argument("module", choices=['questions'], help="Type of scraping module")
    parser.add_argument("--keyword", type=str, help="Keyword to search")
    parser.add_argument("--limit", type=int, default=20, help="Number of questions to fetch")
    
    # ✅ Add this line to accept --time argument
    parser.add_argument("--time", type=str, choices=["day", "week", "month", "year"], help="Time filter")

    args = parser.parse_args()

    module_name = args.module
    save_path = Path(userpaths.get_my_documents()) / "QuoraScraperData" / module_name
    save_path.mkdir(parents=True, exist_ok=True)

    if module_name == 'questions':
        if not args.keyword:
            print(" Please provide --keyword for questions scraping.")
            return

        questions_by_keyword(args.keyword, args.limit, save_path, time_filter=args.time)

    end_time = datetime.now()
    print('\n Crawling completed in:', end_time - start_time)

# -----------------------------------------------
if __name__ == "__main__":
    main()
