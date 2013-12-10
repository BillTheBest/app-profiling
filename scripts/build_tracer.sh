#!/bin/sh

echo "### BUILDING TRACER ###"
rm -rf speedtracer
mkdir speedtracer
cd speedtracer
svn co http://src.chromium.org/svn/trunk/tools/depot_tools
depot_tools/gclient config http://speedtracer.googlecode.com/svn/trunk/src
depot_tools/gclient sync
cd src/
ant
echo "### DONE BUILDING TRACER IF NO ERRORS OCCURED ###"

