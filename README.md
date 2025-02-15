### FOR SDK V2 SUPPORT, USE THE NEW ADDON FRAMEWORK
https://github.com/ConstructFund/construct-addon-wizard-scaffold

Just copy the content of any of the directories to start working on an addon.

## How to use Construct 3 Release Github Action

Setup **C3_AUTH_USER** & **C3_AUTH_PASSWORD** secrets in your repository settings. </br>
In your plugin/behavior config.js, add the **addonUrl** property pointitng to your construct 3 addon url. (ie .. https://www.construct.net/en/make-games/addons/###/XXX) </br>
During a push to main the workflow will create a new released based on the config.js version and upload release c3addon file to construct 3. </br>

Thanks for [#endel](https://github.com/endel) for the github action. </br>
https://github.com/endel/construct3-addon-release-github-actions
