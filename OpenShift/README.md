GCPE News WebApp
======================

## Running in OpenShift

This project uses the scripts found in [openshift-project-tools](https://github.com/BCDevOps/openshift-project-tools) to setup and maintain OpenShift environments (both local and hosted).  Refer to the [OpenShift Scripts](https://github.com/BCDevOps/openshift-project-tools/blob/master/bin/README.md) documentation for details.

**These scripts are designed to be run on the command line (using Git Bash for example) in the root `openshift` directory of your project's source code.**

## Running in a Local OpenShift Cluster

At times running in a local cluster is a little different than running in the production cluster.

Differences can include:
* Resource settings.
* Available image runtimes.
* Source repositories (such as your development repo).
* Etc.

To target a different repo and branch, create a `setting.local.sh` file in your project's local `openshift` directory and override the GIT parameters, for example;
```
export GIT_URI="https://github.com/GeorgeWalker/gcpe-news-webapp.git"
export GIT_REF="openshift-updates"
```

Then run the following command from the project's local `openshift` directory:
```
genParams.sh -l
```

**Git Bash Note:  Ensure that you do not have a linux "oc" binary on your path if using Git Bash on a Windows PC to run the scripts.  A windows "oc.exe" binary will work fine.

This will generate local settings files for all of the builds, deployments, and Jenkins pipelines.
The settings in these files will be specific to your local configuration and will be applied when you run the `genBuilds.sh` or `genDepls.sh` scripts with the `-l` switch.

### Important Local Configuration for the GCPE-News-WebApp project

Before you deploy your local build configurations ...

The application uses .Net 2.0 s2i images for the builds.  In the pathfinder environment these components utilize the `dotnet-20-rhel7` image which is available at registry.access.redhat.com/dotnet/dotnet-20-rhel7.  For local builds this image can still be downloaded, however you will receive errors during any builds (Docker builds) that try to use `yum` to install any additional packages.  

To resolve this issue the project defines builds for `dotnet-20-runtime-centos7` and `dotnet-20-centos7`; which at the time of writing were not available in image form.  The `dotnet-20-centos7` s2i image is the CentOS equivalent of the `dotnet-20-rhel7` s2i image that can be used for local development.  These two images are not used in the Pathfinder environment and exist only to be used in a local environment.

To switch to the `dotnet-20-centos7` image for local deployment, open your `client-build.local.param` and `dotnet-20-node-89-build.local.param` file and update the following 2 lines;

```
# SOURCE_IMAGE_KIND=DockerImage
# SOURCE_IMAGE_NAME=registry.access.redhat.com/dotnet/dotnet-20-rhel7
```
with
```
SOURCE_IMAGE_KIND=ImageStreamTag
SOURCE_IMAGE_NAME=dotnet-20-centos7
```

### Preparing for local deployment

1. Install the oc cli.  
2. Start an OpenShift cluster.  If you are using Docker you can use the `oc-cluster-up.sh` scripts from [openshift-project-tools](https://github.com/BCDevOps/openshift-project-tools).
3. Run `generateLocalProjects.sh` to create the projects in your local cluster.
4. Run `initOSProjects.sh` to update the deployment permissions on the projects.
5. To fix the routes in your local deployment environments use the `updateRoutes.sh` script.

From here on out the commands used to deploy and management the application configurations are basically the same for a local cluster as they are for the Pathfinder environment.

## Deploying your project

All of the commands listed in the following sections must be run from the root `openshift` directory of your project's source code.

### Before you begin ...

If you are updating an existing environment you will need to be conscious of retaining access to the existing data in the given environment.  User accounts, database names, and database credentials can all be affected.  The processes affecting them should be reviewed and understood before proceeding.

For example, the process of deploying and managing database credentials has changed.  The process has moved to using shared secretes that are mounted as environment variables, where previously they were provisioned as discrete environment variables in each component's environment.  Further the new deployment process, by default, will create a random set of credentials for each deployment or update (a new set every time you run `genDepls.sh`).  Being that the credentials are shared, there is a single source and place that needs to be updated.  You simply need to ensure the credentials are updated to the values expected by the pre-configured environment if needed.

### Initialization

If you are working with a new set of OpenShift projects, or you have run a `oc delete all --all` to start over, run the `initOSProjects.sh` script, this will repair the cluster file system services (in the Pathfinder environment), and ensure the deployment environments have the correct permissions to deploy images from the tools project.

### Generating the Builds, Images and Pipelines in the Tools Project

Run the following script to generate the builds, images and pipelines:
```
genBuilds.sh
```

(use `genBuilds.sh -l` if you are deploying to a local instance of OpenShift)


All of the builds should start automatically as their dependencies are available, starting with builds with only docker image and source dependencies.

The process of deploying the Jenkins pipelines will automatically provision a Jenkins instance if one does not already exist.  This makes it easy to start fresh; you can simply delete the existing instance along with it's associated PVC, and fresh instances will be provisioned.

### Jenkins Configuration

If you wish to use the full pipeline definition, with support for advanced functional testing, security scans etc, please see [this document](Jenkins.md).  

### Generate the Deployment Configurations and Deploy the Components

Run;
```
genDepls.sh -e <environmentName/>
```
, and follow the instructions to deploy the application components to the desired environments.

### Wire up your Jenkins Pipelines

By design the pipeline definitions have web hook secrets not included.  These can be added using the Web interface for OpenShift; locate the pipeline you wish to configure a web hook for, and use the Edit action menu option.  Click "Show advanced options" to enable the Web Hook fields, and then add a new web hook by using the Add WebHook form.  Be sure to choose  Github as the type.

Copy and paste the pipeline's web-hook url into the Payload URL of the GIT web-hook (it comes complete with the secret).  Be sure to click Save before you close the edit form.

Set the content type to **application/json**

Select **Just the push event**

Check **Active**

Click **Add webhook**

Credit:  [George Walker](https://github.com/GeorgeWalker), [Wade Barnes](https://github.com/WadeBarnes) contributed to this page.
