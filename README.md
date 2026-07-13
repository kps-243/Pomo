# Pomo
Organise your working life and optimise it with our tools (calendar, tasks, pomodoro, tchats) !

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