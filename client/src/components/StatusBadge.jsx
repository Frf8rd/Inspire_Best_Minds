import { STATUS } from '../utils/constants'

export default function StatusBadge({ status }) {
  return <span className="badge" style={{ '--c': STATUS[status].color }}>{STATUS[status].label}</span>
}
