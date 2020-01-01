CXXFLAGS= -g -Wall -std=c++14
CXX= c++
LDFLAGS= -lm
BASICOBJECTS= playerMain.o gameInfo.o fieldMap.o
SIMPLEOBJECTS= $(BASICOBJECTS) greedySamurai.o snoopyDog.o
RANDOMOBJECTS= $(BASICOBJECTS) randomSamurai.o randomDog.o
TIMEOUTOBJECTS=  $(BASICOBJECTS) timeoutSamurai.o randomDog.o
EXECUTABLES= simplePlayer randomPlayer timeoutPlayer
DIGGEROBJECTS= $(BASICOBJECTS) diggerSamurai.o randomDog.o

all: $(EXECUTABLES)

debugging: all diggerPlayer

simplePlayer: $(SIMPLEOBJECTS)
	${CXX} -o $@ $^ $(LDFLAGS)

randomPlayer: $(RANDOMOBJECTS)
	${CXX} -o $@ $^ $(LDFLAGS)

timeoutPlayer: $(TIMEOUTOBJECTS)
	${CXX} -o $@ $^ $(LDFLAGS)

diggerPlayer: $(DIGGEROBJECTS)
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
