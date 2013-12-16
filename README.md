![General overview of an application profiling method](/doc/procedure_overview.png "General overview of an application profiling method")


## Setting up the web application profiling environment

Make sure git and nodejs is installed properly on the machine used to setup the profiling environment. 
Execute following commands:

```
$ git clone https://github.com/mlasak/app-profiling.git
$ cd app-profiling 
$ npm install 
```

## Starting the web application profiling environment

To start the profiling environment execute the following command within the ```app-profiling``` directory:

```
$ node index.js
```

## Launching the profiling user interface

Once the profiling environment has been started a user interface to control the profiling will be accessible at
```http://localhost:3000/ ``` when launching in a Web browser on the same machine as the profiling environment. 
Alternatively use the IP address of the host where the profiling environment was set up to browse remotely. 

## First example: Interaction with the profiling user interface

The multi-device web application profiling environment can be controlled via an Web browser based user interface. The interface consists of two main views, a testsuite and a reports view. The testsuites view is meant for organising testcases. It supports the creation and editing of testcases that can be run on one or more devices simultaneously. Finally, in the testsuites view the execution of testcases can be triggered. In the reports view a list of already executed testcases can be viewed. For evaluation purposes, visualisations of aggregations upon the profiling data recorded during the test executions can be accessed.

## Testsuites, Testcases and Reports


