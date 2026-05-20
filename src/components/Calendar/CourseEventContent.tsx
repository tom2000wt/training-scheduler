interface Props {
  subject: string;
  classroom: string;
  grade: string;
  className: string;
}

export default function CourseEventContent({ subject, classroom, grade, className }: Props) {
  const bottom = [grade, className].filter(Boolean).join(' ');
  return (
    <div style={{ padding: '1px 4px', fontSize: 11, lineHeight: '15px', overflow: 'hidden' }}>
      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject}</div>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{classroom}</div>
      <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {bottom}
      </div>
    </div>
  );
}
