CXXFLAGS= -g -Wall
CXX= c++
LDFLAGS= -lm
BASICOBJECTS= playerMain.o gameInfo.o fieldMap.o
SIMPLEOBJECTS= $(BASICOBJECTS) greedySamurai.o snoopyDog.o
RANDOMOBJECTS= $(BASICOBJECTS) randomSamurai.o randomDog.o
EXECUTABLES= simplePlayer randomPlayer

all: $(EXECUTABLES)

simplePlayer: $(SIMPLEOBJECTS)
	${CXX} -o $@ $^ $(LDFLAGS)

randomPlayer: $(RANDOMOBJECTS)
	${CXX} -o $@ $^ $(LDFLAGS)

-include ${OBJECTS:.o=.d}

.cc.o:
	${CXX} -c ${CXXFLAGS} $*.cc -o $*.o
	${CXX} -MM ${CXXFLAGS} $*.cc > $*.d

TAGS:
	etags *.cc *.hh

clean:
	rm -f TAGS
	rm -f *.o *.d
	rm -rf *~ */*~ \#*\#

distclean: clean
	rm -f ${EXECUTABLES}
