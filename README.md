# Pomo

Organise your working life and optimise it with our tools (calendar, tasks, pomodoro, tchats) !

## Features

- **Calendars** — a personal one, plus a shared one per group. Both hold **tasks** (a due date, no duration) and **events** (a start and an end date). Everything is created from the calendar itself through a single modal with two views.
- **To do lists** — personal or shared with a group, drag & drop reordering, statuses, members and due dates.
- **Groups** — invitations by email, member management and real-time chat with message reporting.
- **Calendar sync** — every user gets a private iCal feed (tasks + events, personal + groups) to subscribe to from Google Calendar, Outlook or Apple Calendar.
- **Accounts** — email/password, GitHub & Google OAuth, two-factor authentication and password reset.

## Requirements

- Docker

## Deploy for developpment (with Docker)

- Clone the repository `git clone https://github.com/kps-243/Pomo.git`
- Move to the app repository `cd Pomo`
- Create the docker env file `cat pomo/.env.docker.example > pomo/.env.docker`
- Start your Docker Daemon or your Docker Desktop
- Execute this command `docker compose up -d --build`

Congrats your app is launch on **http://localhost:3333**, where you can start your dev !
You can manage your database at **http://localhost:8080/** !

On every start the container runs `npm run migrate` (`migration:fresh` + seeders): the database is
reset and refilled with demo data, so you can log in right away with `test@test.com` /
`TESTtest00!!` — but anything you created in the previous session is gone.

## Going further

- Running the test suites (unit, integration, e2e): [`TESTING.md`](TESTING.md)
- Deploying to production (VPS, Traefik, GitHub Actions): [`DEPLOYMENT.md`](DEPLOYMENT.md)
