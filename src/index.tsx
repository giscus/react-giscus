import { useRef } from 'react';
import { useEffect, useState } from 'react';
import IframeResizer from 'iframe-resizer-react';

const GISCUS_SESSION_KEY = 'giscus-session';
const GISCUS_ORIGIN = 'https://giscus.app';
const ERROR_SUGGESTION = `Please consider reporting this error at https://github.com/laymonage/giscus/issues/new.`;

function formatError(message: string) {
  return `[giscus] An error occurred. Error message: "${message}".`;
}

function getOgMetaContent(property: string) {
  const element = document.querySelector(
    `meta[property='og:${property}'],meta[name='${property}']`,
  ) as HTMLMetaElement;

  return element ? element.content : '';
}

interface IGiscusProps {
  repo: string;
  repoId: string;
  category?: string;
  categoryId?: string;
  mapping: 'url' | 'title' | 'og:title' | 'specific' | 'number' | 'pathname';
  term?: string;
  theme?: string;
  reactionsEnabled?: string;
}

function GiscusClient({
  repo,
  repoId,
  category = '',
  categoryId = '',
  mapping,
  term = '',
  theme = '',
  reactionsEnabled = '1',
}: IGiscusProps) {
  const origin = location.href;
  const url = new URL(origin);
  const savedSession = localStorage.getItem(GISCUS_SESSION_KEY);
  const description = getOgMetaContent('description');

  const [session, setSession] = useState(url.searchParams.get('giscus') || '');

  useEffect(() => {
    if (session) {
      localStorage.setItem(GISCUS_SESSION_KEY, JSON.stringify(session));
      url.searchParams.delete('giscus');
      history.replaceState(undefined, document.title, url.toString());
      return;
    }

    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession || '') || '');
      } catch (e) {
        setSession('');
        localStorage.removeItem(GISCUS_SESSION_KEY);
        console.warn(`${formatError(e?.message)} Session has been cleared.`);
      }
    }
  }, []);

  const params: Record<string, string> = {
    origin,
    session,
    theme,
    reactionsEnabled,
    repo,
    repoId,
    category,
    categoryId,
    description,
  };

  switch (mapping) {
    case 'url':
      params.term = location.href;
      break;
    case 'title':
      params.term = document.title;
      break;
    case 'og:title':
      params.term = getOgMetaContent('title');
      break;
    case 'specific':
      params.term = term;
      break;
    case 'number':
      params.number = term;
      break;
    case 'pathname':
    default:
      params.term =
        location.pathname.length < 2 ? 'index' : location.pathname.substr(1).replace(/\.\w+$/, '');
      break;
  }

  const src = `${GISCUS_ORIGIN}/widget?${new URLSearchParams(params)}`;

  useEffect(() => {
    // Create default style and prepend as <head>'s first child to make override possible.
    const style = document.getElementById('giscus-css') || document.createElement('style');
    style.id = 'giscus-css';
    style.textContent = `
      .giscus, .giscus-frame {
        width: 100%;
      }

      .giscus-frame {
        border: none;
        color-scheme: auto;
      }
    `;
    document.head.prepend(style);
  }, []);

  useEffect(() => {
    // Listen to error messages
    const listener = (event: MessageEvent) => {
      if (event.origin !== GISCUS_ORIGIN) return;

      const { data } = event;
      if (!(typeof data === 'object' && data?.giscus?.error)) return;

      const message: string = data.giscus.error;

      if (message.includes('Bad credentials') || message.includes('Invalid state value')) {
        // Might be because token is expired or other causes
        if (localStorage.getItem(GISCUS_SESSION_KEY) !== null) {
          localStorage.removeItem(GISCUS_SESSION_KEY);
          setSession('');
          console.warn(`${formatError(message)} Session has been cleared.`);
          return;
        }

        if (!savedSession) {
          console.error(
            `${formatError(message)} No session is stored initially. ${ERROR_SUGGESTION}`,
          );
        }
      }

      if (message.includes('Discussion not found')) {
        console.warn(
          `[giscus] ${message}. A new discussion will be created if a comment/reaction is submitted.`,
        );
        return;
      }

      console.error(`${formatError(message)} ${ERROR_SUGGESTION}`);
    };

    window.addEventListener('message', listener);

    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <div className="giscus">
      <IframeResizer
        className="giscus-frame"
        title="Comments"
        scrolling={false}
        src={src}
        checkOrigin={[GISCUS_ORIGIN]}
      />
    </div>
  );
}

export default function Giscus({
  repo,
  repoId,
  category,
  categoryId,
  mapping,
  term,
  theme,
  reactionsEnabled,
}: IGiscusProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;
  return (
    <GiscusClient
      repo={repo}
      repoId={repoId}
      category={category}
      categoryId={categoryId}
      mapping={mapping}
      term={term}
      theme={theme}
      reactionsEnabled={reactionsEnabled}
    />
  );
}
