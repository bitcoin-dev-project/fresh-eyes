# FRESHEYES-WEB

## Overview
Fresheyes web is the client facing application of the fresheyes cli application used to streamline the code review process by integrating with Github's API. You will need to provide authentication access when you login in with your github account which we will use to provide the necessary permissions for the application's functionality.

## Installations
change directory `cd` into the fresheyes-web folder

- `cd client/fresheyes-web` 
- `npm install ` to install necessary dependencies
- `npm run dev` to start the client application 

**NOTE:** You need have the server running to avoid running into errors

## Using the application
- Provide the necessary paramters `owner` `repo` `pull_number` of the pull request you want to recreate 
- Click on the `Create PR` button
- Success! you can view the recreated PR from the `VIEW PR` link on the pop-up modal