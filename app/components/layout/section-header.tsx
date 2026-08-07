interface SectionHeaderProps {
  title: string
  description?: string
}

export default function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-0.5">
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}