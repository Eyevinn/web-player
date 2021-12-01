import { h } from 'preact';
import style from './metaDataContainer.module.css'

export default function MetaDataContainer({metaData}: {metaData}) {
  // console.log(metaData);
  if (!metaData) return null
  return <div>{metaData[0]['X-TITLE']}</div>;
}
