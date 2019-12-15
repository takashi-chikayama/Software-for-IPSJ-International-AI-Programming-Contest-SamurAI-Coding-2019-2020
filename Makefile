all:
	cd manager; make all
	cd players; make all

testrun: all
	manager/manager samples/sample.dighere players/simplePlayer players/simplePlayer >samples/testout.dighere

TAGS:
	etags */*.cc */*.hh

clean:
	rm -f TAGS
	rm -f *.o *.d
	rm -rf *~ */*~ \#*\#

distclean: clean
	cd manager; make distclean
	cd players; make distclean
	cd samples; make distclean
	cd documents; make distclean
	cd webpage; make distclean
	cd icons; make distclean
	cd logos; make distclean
	cd sounds; make distclean
