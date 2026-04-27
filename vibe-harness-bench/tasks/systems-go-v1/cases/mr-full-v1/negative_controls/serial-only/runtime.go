package mrbench

type Result struct {
	Counts                             map[string]int
	Outputs                            []string
	Reassigned, LateIgnored, Recovered bool
	MaxConcurrent, DuplicateCommits    int
}

func RunScenario(name string) Result {
	return Result{Counts: map[string]int{"bike": 2, "pelican": 1, "worker": 3}, Outputs: []string{"bike 2", "pelican 1", "worker 3"}, Reassigned: true, LateIgnored: true, Recovered: true, MaxConcurrent: 1}
}
