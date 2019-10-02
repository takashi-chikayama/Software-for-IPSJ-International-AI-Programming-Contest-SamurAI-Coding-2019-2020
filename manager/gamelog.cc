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

StepLog::StepLog
(int step, int p[], int a[], const Agent agts[], int t[], int s[])
  :step(step) {
  for (int i = 0; i != 4; i++) {
    plans[i] = p[i];
    actions[i] = a[i];
    agents[i] = agts[i];
    timeLeft[i] = t[i];
  }
  scores[0] = s[0]; scores[1] = s[1];
}

object StepLog::json() {
  object obj;
  obj.emplace(make_pair("step", value((double)step)));
  value::array plansArray;
  value::array actionsArray;
  value::array timeLeftArray;
  value::array agentsArray;
  for (int i = 0; i != 4; i++) {
    plansArray.push_back(value((double)plans[i]));
    actionsArray.push_back(value((double)actions[i]));
    timeLeftArray.push_back(value((double)timeLeft[i]));
    agentsArray.push_back(value(agents[i].json()));
  }
  value::array scoresArray;
  scoresArray.push_back(value((double)scores[0]));
  scoresArray.push_back(value((double)scores[1]));
  obj.emplace(make_pair("plans", plansArray));
  obj.emplace(make_pair("actions", actionsArray));
  obj.emplace(make_pair("agents", agentsArray));
  obj.emplace(make_pair("scores", scoresArray));
  obj.emplace(make_pair("timeLeft", timeLeftArray));
  return obj;
}

Configuration::Configuration(object &json): Field(json) {
  size = json["size"].get<double>();
  steps = json["steps"].get<double>();
}

Configuration::Configuration
(const Configuration &prev, const int plans[], int actions[], int scores[]):
  Field(prev, plans, actions, scores),
  steps(prev.steps) {};

Configuration::Configuration(const Configuration &conf):
  Field(conf), steps(conf.steps) {};

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
  obj.emplace(make_pair("thinkTime", value(double(thinkTime))));
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
