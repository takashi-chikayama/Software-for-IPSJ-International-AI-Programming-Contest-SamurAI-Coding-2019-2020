#include "gameinfo.hh"

void plan(GameInfo &info) {};

int main(int argc, char* argv[]) {
  while (!cin.eof()) {
    GameInfo info(cin);
    cout << info;
    plan(info);
  }
  return 0;
}
