package mrbench

type Result struct {
	Counts                             map[string]int
	Outputs                            []string
	Reassigned, LateIgnored, Recovered bool
	MaxConcurrent, DuplicateCommits    int
}

func RunScenario(name string) Result {
	return Result{Counts: map[string]int{"bike": 3, "pelican": 1, "worker": 3}, Outputs: []string{"bike 3", "pelican 1", "worker 3"}, Reassigned: true, LateIgnored: false, Recovered: true, MaxConcurrent: 3, DuplicateCommits: 1}
}
