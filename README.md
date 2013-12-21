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

### Profiling preparation

Each device involved in the profiling should have a Web browser started with enabled remote debugging. The communication between the Web runtimes and the profiling server is based on the [Remote Debugging Protocol v1.0](https://developers.google.com/chrome-developer-tools/docs/protocol/1.0/index).

On desktops launching a google chrome browser with enabled remote debugging can be achieved with the following command in shell console / terminal

```
$ google-chrome --remote-debugging-port=9222
$ # or on Mac OSX
$ /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

Check the connection by navigating with a WebSockets enabled browser to http://HOST-IP:9222
If connection to the machine running chrome with debugging is not possible right away, than may be a SSL tunnel may help. For this, run in an other shell console / terminal the following

```
$ ssh -L 0.0.0.0:9223:localhost:9222 localhost -N
```

Now the machine with chrome with enabled remote debugging is accessible at http://HOST-IP:9223 from remote machines.

### Running the example

* Make sure your PZP runs and has a Web runtime or browser configured with remote debugging (see above)
* On your profiling host launch ```http://localhost:3000/ ``` in a WebSocket capable browser
* Click on "Testsuites"
* Click on "List Testsuites"
* Click on "edit sample.json"
* expand the device and make sure the connection setting fit your configuration
* expand the Testcase to have a look on the step sequence
* Click "save" to persist any changes
* Click on "List Testsuites"
* Finally, specify an execution title right next to the test case title "run the famous get42 example" and click "execute"

The test case is being executed. To see the results:

* On your profiling host launch ```http://localhost:3000/ ``` in a WebSocket capable browser
* Click on "Reports"
* Click on "List Reports"
* Click on "visualise" to trigger the conversion of the raw profiling data and graph generation.

You should see a visualisation like in the following figure if you repeat the execution.

![Report visualisation after profiling](/doc/report.png "Report visualisation after profiling")


## Testsuites, Testcases and Reports

With the application profiling framework up and running the user interface is accessible at```http://localhost:3000/ ``` to organise test suites. 
