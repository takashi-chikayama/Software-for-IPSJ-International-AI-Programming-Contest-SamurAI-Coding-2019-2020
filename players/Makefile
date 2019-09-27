CXXFLAGS= -g -Wall
CXX= c++
LDFLAGS= -lm
OBJECTS= playerMain.o gameInfo.o fieldMap.o greedySamurai.o snoopyDog.o
EXECUTABLE= simplePlayer

all: $(EXECUTABLE)

simplePlayer: $(OBJECTS)
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
	rm -f ${EXECUTABLE}
