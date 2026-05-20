interface Props {
  subject: string;
  classroom: string;
  grade: string;
  className: string;
}

export default function CourseEventContent({ subject, classroom, grade, className }: Props) {
  return (
    <div style={{ padding: '2px 4px', fontSize: 12, lineHeight: '18px', overflow: 'hidden' }}>
      <div style={{ fontWeight: 600 }}>{subject}</div>
      <div>{classroom}</div>
      <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 11 }}>
        {grade}{className ? ' ' + className : ''}
      </div>
    </div>
  );
}
