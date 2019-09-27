#include "players.hh"

int main(int argc, char* argv[]) {
  while (!cin.eof()) {
    GameInfo info(cin);
    int plan = info.id < 2 ? planSamurai(info) : planDog(info);
    cout << plan << endl;
  }
  return 0;
}
