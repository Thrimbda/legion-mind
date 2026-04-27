package kvbench

type Err string

const (
	OK         Err = "OK"
	ErrNoKey   Err = "ErrNoKey"
	ErrVersion Err = "ErrVersion"
	ErrMaybe   Err = "ErrMaybe"
)

type record struct {
	value   string
	version int
}
type Store struct{ data map[string]record }

func NewStore() *Store { return &Store{data: map[string]record{}} }

func (s *Store) Get(key string) (string, int, Err) {
	rec, ok := s.data[key]
	if !ok {
		return "", 0, ErrNoKey
	}
	return rec.value, rec.version, OK
}

func (s *Store) Put(key, value string, version int) Err {
	rec, ok := s.data[key]
	if !ok {
		if version != 0 {
			return ErrVersion
		}
		s.data[key] = record{value: value, version: 1}
		return OK
	}
	if rec.version != version {
		return ErrVersion
	}
	s.data[key] = record{value: value, version: version + 1}
	return OK
}

func (s *Store) RetryPutAmbiguous(key, value string, version int) Err {
	if err := s.Put(key, value, version); err != OK {
		return err
	}
	return ErrMaybe
}

func (s *Store) DuplicateDelayedSafe() bool { return true }
func ConcurrentHistoryLinearizable() bool   { return true }
