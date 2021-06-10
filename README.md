# gcpe-news-webapp
BC Government News web application


Introduction
----------------
This is a C# application that provides a user interface for the BC Gov News website. 

Repository Map
--------------
- .s2i : Source to image bash assemble script
- **Gov.News.WebApp**: C# Dotnet Core 2 MVC Frontend App
- Dotnet-Snyk: Source for a Dotnet + Snyk container
- Dotnet-Sonar: Source for a SonarQube scanner
- functional-tests: BDD Tests
- OpenShift: OpenShift scripts and documentation


Installation
------------
Follow the instructions in the [OpenShift](openshift) folder.
	
Developer Prerequisites
-----------------------

**Gov.News.WebApp**
- Visual Studio 2019
(or comparable IDE able to edit C# code)


**DevOps**
- OpenShift Container Platform 3.7 or newer (Origin is supported)
- RedHat OpenShift tools
- Docker
- Full Git install, including Git bash  
- A familiarity with Jenkins

Development
-----------
A Visual Studio 2017 solution has been provided, however Visual Studio Pro is not required to build the solution.  You may use Visual Studio Community or the command line (dotnet build) 


Contribution
------------

Please report any [issues](https://github.com/bcgov/gcpe-news-webapp/issues).

[Pull requests](https://github.com/bcgov/gcpe-news-webapp/pulls) are always welcome.

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

License
-------

    Copyright 2018 Province of British Columbia

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at 

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

Maintenance
-----------

This repository is maintained by [GCPE](http://www.gov.bc.ca/).
Click [here](https://github.com/orgs/bcgov/teams/gcpe/repositories) for a complete list of our repositories on GitHub.

