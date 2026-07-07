Issue Tracker API

This repository contains the backend service for an issue tracking application. 
It is built using FastAPI and PostgreSQL to handle project workspaces, boards, issue lifecycles, and user collaboration.

Features

User Authentication: Secure signup and login endpoints using password hashing and token-refresh mechanics. 

Workspace Management: Hierarchical separation of work environments where users can create independent workspaces. 

Role Based Memberships: Control system assigning roles such as Owner, Admin, Member, or Viewer to users within a workspace. 

Project Boards: Organizes tasks into dedicated boards mapped to specific workspaces.  

Issue Tracking: Creation and management of core tasks, supporting priorities (low, medium, high) and statuses (pending, in progress, completed). 

Granular Task Details: Support for sub-issues, customizable workspace labels, assignee distribution, and user comments.  
Requirements
Python 3.10 or higher
PostgreSQL Database

Installation

Clone the repository to your local system:
git clone https://github.com/harshit-dev-io/issue-tracker.git
cd issue-tracker

Create a virtual environment and activate it:
python -m venv venv
source venv/bin/activate

Install the application and its dependencies:
pip install -r requirements.txt

Configure your environment variables for your database connection and token signing keys.

Database Initialization

The application uses an asynchronous SQLAlchemy engine. When the FastAPI application starts up, it automatically checks the metadata definitions and creates any missing database tables for Users, Refresh Tokens, Workspaces, Memberships, Boards, Labels, Issues, Sub-Issues, and Comments.  

Running the Application

Start the local development server using uvicorn:
uvicorn app.main:app --reload

The API documentation will then be available locally at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

Complete API Endpoints List
Authentication
POST /auth/signup/ Register a new user account.  
POST /auth/login/ Authenticate a user and receive access and refresh tokens.  
POST /auth/refresh/ Trade a valid refresh token for a new access token.  
Workspaces
POST /workspace/create/ Initialize a new workspace.  
GET /workspace/list/ Fetch a paginated list of workspaces tied to the authenticated user.  
Memberships
POST /membership/create/ Add a user to a workspace with a specific role.  
GET /membership/list/ View all members and their roles within a specific workspace.  
Boards
POST /board/create/ Add a new tracking board inside a workspace.  
GET /board/list/ List all tracking boards available within a workspace.  
Labels
POST /label/create/ Create a new label for categorization within a workspace.  
GET /label/list/ Retrieve all labels created for a specific workspace.  
Issues
POST /issue/create/ Create a primary issue containing target boards, priority levels, labels, and assignees.  
PUT /issue/update/ Modify core attributes, statuses, labels, or tracking details of an existing issue.  
GET /issue/list/ Retrieve all issues belonging to a specific board.  
GET /issue/search/ Filter and find issues inside a board by name using text parameters.  
DELETE /issue/delete/ Remove an issue from a workspace completely.  
Sub-Issues
POST /sub_issue/create/ Create a nested task linked directly to a parent issue.  
Comments
POST /comment/create/ Publish a text comment on a specific issue.  