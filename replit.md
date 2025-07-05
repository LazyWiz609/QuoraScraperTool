# Quora Question Scraper and Auto Answer Generator

## Overview

This is a full-stack web application that allows users to scrape questions from Quora based on keywords, generate AI-powered answers using Google Gemini, and export the results as PDF documents. The application features a modern React frontend with TypeScript, an Express.js backend with session-based authentication, and PostgreSQL database integration using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS styling (shadcn/ui)
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Authentication**: Session-based authentication with bcrypt password hashing
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL session store

### Database Schema
The application uses four main tables:
- `users`: User authentication and profile data
- `scraping_jobs`: Job tracking for scraping operations
- `questions`: Scraped questions with selection status
- `answers`: AI-generated answers linked to questions

## Key Components

### Authentication System
- Session-based authentication with secure cookie handling
- Password hashing using bcryptjs
- Protected routes requiring authentication
- User context management on frontend

### Scraping Service
- Pluggable scraper architecture designed for external Python script integration
- Currently uses mock data with realistic question templates
- Supports keyword-based filtering and time-based constraints
- Configurable question limits per scraping job

### AI Answer Generation
- Google Gemini API integration for answer generation
- Batch processing with rate limiting
- Error handling and fallback responses
- Configurable API key management

### PDF Export System
- PDFKit-based PDF generation
- Formatted Q&A pairs with metadata
- Download functionality with proper file naming
- Responsive design considerations

### Data Flow
1. User submits scraping parameters (topic, keyword, filters)
2. Backend creates scraping job and processes request
3. Questions are stored and presented for user selection
4. Selected questions are sent to AI service for answer generation
5. Generated answers are stored and can be exported as PDF

## External Dependencies

### Core Dependencies
- **@google/generative-ai**: Google Gemini API client
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **bcryptjs**: Password hashing
- **pdfkit**: PDF generation
- **express-session**: Session management

### UI Dependencies
- **@radix-ui/***: Comprehensive UI component library
- **@tanstack/react-query**: Server state management
- **tailwindcss**: CSS framework
- **wouter**: Lightweight routing

## Deployment Strategy

### Development Environment
- Vite dev server for frontend hot reloading
- Express server with TypeScript compilation via tsx
- Environment variables for API keys and database connection
- Replit-specific development tooling integration

### Production Build
- Vite builds optimized React bundle
- esbuild compiles backend TypeScript to ESM
- Static assets served from Express server
- Database migrations handled via Drizzle Kit

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini API authentication
- `SESSION_SECRET`: Session encryption key
- `NODE_ENV`: Environment mode (development/production)

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 05, 2025. Initial setup