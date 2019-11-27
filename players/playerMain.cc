#include "players.hh"

int main(int argc, char* argv[]) {
  while (true) {
    GameInfo info(cin);
    if(cin.eof() )
      break;
    int plan = info.id < 2 ? planSamurai(info) : planDog(info);
    cout << plan << endl;
  }
  return 0;
}
