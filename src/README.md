# Smart Activity Journal: Fusing Garmin Workouts with Mobile Context and Calendar Intelligence

## Description

This project consists of a client-server application that combines fitness activity data collected by a fitness tracker with calendar events from the user's mobile device. The application's main purpose is to enhance the user's understanding of their fitness activities by providing insights that would otherwise be difficult to obtain due to the different sources of information.

To this end, the application provides a simple overview of the health and fitness data collected by the tracker's sensors, showing how this data relates to calendar events.

### Main Features
#### Super-events generation

When a user saves a new fitness activity on their fitness tracker, the application checks the user's mobile device for conflicting calendar events. If any are found, they will be sent to the back end, where machine learning models will predict whether the event and the activity are related. If so, a super-event incorporating information from both the activity and the event will be created and sent back to the front end, where it will be displayed to the user.

<div align="center">
<img src="doc/images/27.png" width="200"/> <img src="doc/images/28.png" width="200"/>
</div>

#### Daily health reports

The application shows daily reports including data statistics. Each report is updated when the application is restarted, and reports for previous days are also available by swiping. Each report contains links to related super-events, providing quick access to the context in which the user's health values were displayed.

<div align="center">
<img src="doc/images/29.png" width="200"/> <img src="doc/images/30.png" width="200"/>
</div>

#### Automatic activity scheduling

To reduce the need for manual interaction, the application automatically books fitness events based on the user's habits. This is done through an algorithm that takes a couple of weeks to tune itself, after which it starts scheduling the next activity on the user's mobile device calendar. If there are conflicting events in the calendar, the system will try to schedule the activity an hour earlier or later depending on availability. Otherwise, no activity will be booked.

<div align="center">
<img src="doc/images/35.png" width="200"/> <img src="doc/images/36.png" width="200"/>
</div>

Similar features are offered by other applications. For example, the Garmin Connect app enables users to create weekly fitness plans. However, this requires the user to manually select the days of the week, and activities are only booked on the Garmin calendar. This means that other external events are not considered. Google Fit is another application with a journal feature that allows users to track their activities alongside additional descriptions and fitness data. As with Garmin Connect, this journal is isolated and external calendar events cannot be accessed.
Health Connect is another application that groups health data from different apps, giving users quick access to various health statistics collected and stored in different locations.
While these applications offer some features similar to those included in this project, none of them provide the same level of simplicity. Furthermore, these applications are unable to interact with the external environment (with the partial exception of Health Connect) to contextualise their data.

## Structure

```
.
├── doc                                     # project documentation and related files
│   ├── images                              # images for related documentation
│   └── resources
├── src                                     # "source" files to build and develop the project.
│   ├── backend                             # server-side code
|   |   ├── models                          # Machine Learning models and the API to interact with them
|   |   |   ├── model_api.py                # API to feed and train the model
|   |   |   ├── requirements.txt            # python requirements
|   |   |   ├── train_model.py              # script for initial model training
|   │   │   └── training_data.json          # data for initial model training
|   |   ├── node_modules                    # Node.js packages and dependencies that the project needs to run
|   |   ├── .env                            # environmental variables
|   |   ├── authServer.js                   # server for authentication and data exchange
|   |   ├── dataManager.js                  # file that process data
|   |   ├── SQLSchema.sql                   # SQL schema for the database
|   |   └── storeData.js                    # file that interacts with the database to store and retrieve data
│   └── frontend                            # client-side code
|       └── SmartFit                        # sub-directory containing the application 
|           ├── app
|           |   ├── (tabs)                  # directory containing the tabs (pages) of the application
|           |   ├── _layout.tsx             # file defining the overall appearance of the application
|           |   ├── activityBooking.jsx     # automatic activity scheduling algorithm 
|           |   └── helperFunctions.jsx     # helper functions
|           ├── assets                      # fonts and images
|           ├── components                  # UI components
|           ├── constants                   # colours
|           ├── hooks
|           ├── node_modules                # Node.js packages and dependencies that the project needs to run
|           ├── scripts                     # script for resetting the project (to a new Expo project)
|           ├── app.json                    # manifest format for describing the application
|           ├── eas.json                    # configuration file for EAS CLI and services
|           ├── firebaseConfig.js           # file containing the Firebase configuration
|           ├── metro.config.js             # see https://docs.expo.dev/versions/latest/config/metro/
|           ├── package-lock.json           # stores versioned dependency tree 
|           ├── package.json                # build scripts and dependencies
|           ├── README.md
|           └── tsconfig.json               # specifies root files and compiler options required to compile the project
└── README.md

```

## Environment

This project was mainly developed on Ubuntu 24.04.2 LTS (64-bit) using VSCode 1.101.1. The back end was built using Node.js 24.0.3 and Python 3.12.3. The database was implemented using PostgreSQL 16.9. React Native 0.79.2 and Expo 53.0.9 were used for the front end. More detailed information about the technology stack and dependencies can be found in [src/README.md](src/README.md).

## Footnote

This notebook serves for the purposes of Softwarepraktikum mit Bachelorarbeit project dealing with combining fitness tracker activity data and calendar events at the University Of Vienna in the summer semester 2025.
