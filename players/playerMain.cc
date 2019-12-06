#include "players.hh"
#include <string>
#include <iostream>
#include <sstream>

int main(int argc, char* argv[]) {
  stringstream ss;
  auto eof = [&ss]() -> bool {
    char buf[50000];
    for(int i=0;i<13;i++) {
      cin.getline(buf, sizeof(buf));
      ss << buf << "\n";
    }
    return cin.eof();
  };

  while (!eof()) {
    GameInfo info(ss);
    int plan = info.id < 2 ? planSamurai(info) : planDog(info);
    cout << plan << endl;
  }
  return 0;
}
