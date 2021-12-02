import { h } from 'preact';
import style from './metaDataContainer.module.css';

export default function MetaDataContainer({
  metaData,
}: {
  metaData: Record<string, string>[];
}) {
  if (!metaData) return null;
  //TODO: this should be smarter.
  const title = metaData['X-TITLE'];
  return <div class={style.wrapper}>{title ? title : null}</div>;
}
