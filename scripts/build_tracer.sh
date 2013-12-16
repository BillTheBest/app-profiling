#!/bin/sh

# tdb: remove this file. speed tracer seems to be an abandoned project, switching to chromedevtools

echo "### BUILDING TRACER ###"
mkdir -p speedtracer
cd speedtracer/
if [ -d "depot_tools" ]; then
	svn co http://src.chromium.org/svn/trunk/tools/depot_tools
else
	svn update depot_tools/
fi
depot_tools/gclient config http://speedtracer.googlecode.com/svn/trunk/src
depot_tools/gclient sync
cd src/
ant
echo "### DONE BUILDING TRACER IF NO ERRORS OCCURED ###"

