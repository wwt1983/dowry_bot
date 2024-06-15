import { FILTER_BY_FORMULA } from './airtable.constants';

export const getFilterById = (keyIds: string[]) => {
  return keyIds.length === 1
    ? `&${FILTER_BY_FORMULA}=FIND("${keyIds[0]}",{Id})`
    : `&${FILTER_BY_FORMULA}=OR(${keyIds.map((x) => `{Id}="${x}"`).join(',')})`;
};
