package mrbench

// Result is the public simulator output expected by the benchmark verifier.
type Result struct {
	Counts           map[string]int
	Outputs          []string
	Reassigned       bool
	LateIgnored      bool
	Recovered        bool
	MaxConcurrent    int
	DuplicateCommits int
}

// RunScenario must implement clean-room MapReduce semantics for the named scenario.
func RunScenario(name string) Result {
	// TODO: implement map/reduce correctness, lease reassignment, late completion
	// suppression, crash recovery, deterministic output ordering, and parallelism.
	return Result{Counts: map[string]int{}, Outputs: []string{}}
}
