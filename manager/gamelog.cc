#include "gamelog.hh"

StepLog::StepLog(object &json) {
  auto plansJson = json["plans"].get<value::array>();
  auto actionsJson = json["actions"].get<value::array>();
  for (int a = 0; a != 4; a++) {
    plans[a] = plansJson[a].get<double>();
    actions[a] = actionsJson[a].get<double>();
  }
  auto scoresJson = json["scores"].get<value::array>();
  scores[0] = scoresJson[0].get<double>();
  scores[1] = scoresJson[1].get<double>();
}

StepLog::StepLog(int p[], int a[], int s[]) {
  for (int i = 0; i != 4; i++) { plans[i] = p[i]; actions[i] = a[i]; }
  scores[0] = s[0]; scores[1] = s[1];
}

object StepLog::json() {
  object obj;
  value::array plansArray;
  value::array actionsArray;
  for (int i = 0; i != 4; i++) {
    plansArray.push_back(value((double)plans[i]));
    actionsArray.push_back(value((double)actions[i]));
  }
  value::array scoresArray;
  scoresArray.push_back(value((double)scores[0]));
  scoresArray.push_back(value((double)scores[1]));
  obj.emplace(make_pair("plans", plansArray));
  obj.emplace(make_pair("actions", actionsArray));
  obj.emplace(make_pair("scores", scoresArray));
  return obj;
}

Configuration::Configuration(object &json): Field(json) {
  size = json["size"].get<double>();
  steps = json["steps"].get<double>();
}

Configuration::Configuration
(const Configuration &prev, const int plans[], int actions[], int scores[]):
  Field(prev, plans, actions, scores),
  timeLimit(prev.timeLimit), steps(prev.steps) {};

Configuration::Configuration(const Configuration &conf):
  Field(conf), timeLimit(conf.timeLimit), steps(conf.steps) {};

GameLog::GameLog(object &json): Configuration(json["field"].get<object>()) {
  auto playsJson = json["plays"].get<value::array>();
  for (auto step: playsJson) {
    plays.emplace_back(StepLog(step.get<object>()));
  }
}

GameLog::GameLog(Configuration &cnf, vector <StepLog> &stepLogs):
  Configuration(cnf) {
  for (StepLog &sl: stepLogs) plays.push_back(sl);
}

object Configuration::json() {
  object obj = Field::json();
  obj.emplace(make_pair("timeLimit", value(double(timeLimit))));
  obj.emplace(make_pair("steps", value(double(steps))));
  return obj;
}

object GameLog::json() {
  object field = Configuration::json();
  object obj;
  obj.emplace(make_pair("filetype", value("SamurAI Dig Here Game Log")));
  obj.emplace(make_pair("field", field));
  value::array playsArray;
  for (StepLog play: plays) playsArray.push_back(value(play.json()));
  obj.emplace(make_pair("plays", playsArray));
  return obj;
}
