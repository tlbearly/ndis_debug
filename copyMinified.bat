REM Run in cmd window from wwwroot\debug
echo Copying minified files to wwwroot
copy javascript\src\errorBox.min.js ..\javascript\errorBox.js
copy javascript\src\gmu.min.js ..\javascript\gmu.js
copy javascript\src\findPlace.min.js ..\javascript\findPlace.js
copy javascript\src\identify.min.js ..\javascript\identify.js
copy javascript\src\print.min.js ..\javascript\print.js
copy javascript\src\print_CPW.min.js ..\javascript\print_CPW.js
copy javascript\src\readConfig.min.js ..\javascript\readConfig.js
copy javascript\src\resourceReport.min.js ..\javascript\resourceReport.js
copy javascript\src\search.min.js ..\javascript\search.js
copy javascript\src\draw.min.js ..\javascript\draw.js

copy javascriptM\src\errorBox.min.js ..\javascriptM\errorBox.js
copy javascriptM\src\print.min.js ..\javascriptM\print.js
copy javascriptM\src\identify.min.js ..\javascriptM\identify.js
copy javascriptM\src\readConfig.min.js ..\javascriptM\readConfig.js

copy javascript\toc\src\agsjs\dijit\TOC.min.js ..\javascript\toc\build\agsjs\dijit\TOC.js
copy javascriptM\toc\src\agsjs\dijit\TOC.min.js ..\javascriptM\toc\build\agsjs\dijit\TOC.js