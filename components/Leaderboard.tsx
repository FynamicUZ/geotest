type Attempt = {
  id: string;
  nickname: string;
  score: number;
  total: number;
  durationSec: number;
  createdAt: string | Date;
};

export default function Leaderboard({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) {
    return (
      <div className="text-sm text-white/50">
        No attempts yet — be the first.
      </div>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-white/50">
        <tr>
          <th className="text-left py-1">#</th>
          <th className="text-left">Nickname</th>
          <th className="text-right">Score</th>
          <th className="text-right">Time</th>
        </tr>
      </thead>
      <tbody>
        {attempts.map((a, i) => (
          <tr key={a.id} className="border-t border-white/5">
            <td className="py-1.5 text-white/40 w-8">{i + 1}</td>
            <td className="text-white">{a.nickname}</td>
            <td className="text-right tabular-nums">
              {a.score}/{a.total}
            </td>
            <td className="text-right tabular-nums text-white/60">
              {a.durationSec ? `${a.durationSec}s` : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
