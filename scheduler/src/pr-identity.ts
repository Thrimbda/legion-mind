export interface CanonicalPullRequestIdentity {
  host: string;
  owner: string;
  repo: string;
  number: number;
  identity: string;
  url: string;
}

export function canonicalizePullRequestUrl(value: string): CanonicalPullRequestIdentity {
  const candidate = value.trim();
  if (!candidate) {
    throw new Error('PR URL must not be empty.');
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`Unsupported PR URL: ${value}`);
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error(`Unsupported PR URL: ${value}`);
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length !== 4 || segments[2] !== 'pull') {
    throw new Error(`Unsupported PR URL: ${value}`);
  }
  const [owner, repo, , numberText] = segments;
  const number = Number(numberText);
  if (!owner || !repo || !Number.isInteger(number) || number <= 0) {
    throw new Error(`Unsupported PR URL: ${value}`);
  }

  const host = parsed.host.toLowerCase();
  const identity = `${host}/${owner.toLowerCase()}/${repo.toLowerCase()}#${number}`;
  return {
    host,
    owner,
    repo,
    number,
    identity,
    url: `https://${host}/${owner}/${repo}/pull/${number}`,
  };
}
