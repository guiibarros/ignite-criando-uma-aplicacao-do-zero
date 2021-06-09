import Link from 'next/link';

import commonStyle from '../../styles/common.module.scss';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={commonStyle.container}>
      <Link href="/">
        <a className={styles.logoLink}>
          <img src="/Logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
