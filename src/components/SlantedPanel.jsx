// Solid parallelogram panel: thin white hard border + hard offset shadow.
export default function SlantedPanel({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`spanel ${className}`} {...rest}>
      <div className="spanel__frame">
        <div className="spanel__inner">{children}</div>
      </div>
    </Tag>
  )
}
