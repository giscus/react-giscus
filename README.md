# react-giscus

A React component for [giscus][giscus], a comments system powered by GitHub
Discussions.

## Installation

```shell
npm install react-giscus
# or
yarn add react-giscus
```

## Usage

Follow the instructions on [the website][giscus] and put the respective
attributes of the shown `<script>` tag as props to the `Giscus` component.

```jsx
import Giscus from 'react-giscus';

export default function MyPage() {
  return (
    <Giscus
      repo=""
      repoId="..."
      category="..."
      categoryId="..."
      mapping="..."
      term="..."
      theme="..."
      reactionsEnabled="..."
    />
  );
}
```

## License

MIT

[giscus]: https://giscus.app
