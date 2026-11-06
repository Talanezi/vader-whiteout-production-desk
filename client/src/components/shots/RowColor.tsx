import type * as Y from 'yjs'
import Menu from '../whiteout/Menu'
import { shotOperation } from '../../lib/shotDocument'
export const rowColors = {
  Blue: '#497797',
  Teal: '#448b85',
  Green: '#658760',
  Amber: '#a18b4e',
  Rose: '#a16f85',
  Violet: '#8072a4',
}
export default function RowColor({
  records,
}: {
  records: Y.Map<unknown>[]
}) {
  return (
    <Menu
      compact
      icon="palette"
      label="Row color"
      items={[
        ...Object.entries(rowColors).map(([label, value]) => ({
          label,
          value,
          onSelect: () =>
            shotOperation(
              records[0].doc!,
              () => records.forEach((r) => r.set('rowColor', value)),
              'local',
            ),
        })),
        {
          label: 'Clear color',
          value: '',
          onSelect: () =>
            shotOperation(
              records[0].doc!,
              () => records.forEach((r) => r.delete('rowColor')),
              'local',
            ),
        },
      ]}
    />
  )
}
