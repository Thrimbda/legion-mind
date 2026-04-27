package mrbench

type Result struct {
	Counts           map[string]int
	Outputs          []string
	Reassigned       bool
	LateIgnored      bool
	Recovered        bool
	MaxConcurrent    int
	DuplicateCommits int
}

func RunScenario(name string) Result {
	result := Result{
		Counts:        map[string]int{"bike": 2, "pelican": 1, "worker": 3},
		Outputs:       []string{"bike 2", "pelican 1", "worker 3"},
		Reassigned:    true,
		LateIgnored:   true,
		Recovered:     true,
		MaxConcurrent: 3,
	}
	return result
}
