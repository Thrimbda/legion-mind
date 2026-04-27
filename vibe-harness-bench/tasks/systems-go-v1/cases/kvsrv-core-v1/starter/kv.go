package kvbench

type Err string

const (
	OK         Err = "OK"
	ErrNoKey   Err = "ErrNoKey"
	ErrVersion Err = "ErrVersion"
	ErrMaybe   Err = "ErrMaybe"
)

type Store struct{}

func NewStore() *Store { return &Store{} }

func (s *Store) Get(key string) (string, int, Err) {
	// TODO: return value, version, and ErrNoKey for missing keys.
	return "", 0, ErrNoKey
}

func (s *Store) Put(key, value string, version int) Err {
	// TODO: enforce versioned Put semantics and increment versions on success.
	return ErrVersion
}

func (s *Store) RetryPutAmbiguous(key, value string, version int) Err {
	// TODO: retry dropped/delayed requests and surface ErrMaybe for ambiguity.
	return ErrVersion
}

func (s *Store) DuplicateDelayedSafe() bool { return false }

func ConcurrentHistoryLinearizable() bool { return false }
