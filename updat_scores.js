const SUPABASE_URL = 'https://gahuzlqdykisexnyoqyo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhaHV6bHFkeWtpc2V4bnlvcXlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ2ODQyNiwiZXhwIjoyMDkxMDQ0NDI2fQ.oTtUb0SnEM241Ack5FBymSHukEva0SaVA2m7POHRv2Q';
const TOURNAMENT_ID = 'R2026014'; // Masters - update to PGA Championship ID later

async function updateScores() {
  const res = await fetch('https://orchestrator.pgatour.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'da2-gsrx5bibzbb4njvhl7t37wqyl4',
    },
    body: JSON.stringify({
      query: `{
        leaderboardV2(id: "${TOURNAMENT_ID}") {
          tournamentStatus
          players {
            ... on PlayerRowV2 {
              position
              leaderboardSortOrder
              playerState
              total
              player {
                displayName
              }
            }
          }
        }
      }`
    })
  });

  const data = await res.json();
  const players = data?.data?.leaderboardV2?.players ?? [];

  if (!players.length) {
    console.log('No player data found');
    return;
  }

  const rows = players.map(p => {
    const posStr = p.position ?? '';
    const posNum = parseInt(posStr.replace('T', '')) || (p.leaderboardSortOrder + 1);
    return {
      golfer: p.player?.displayName,
      position: posNum,
      made_cut: p.total === 'E' || p.total?.startsWith('-') || (p.total?.startsWith('+') && parseInt(p.total) <= 4),
      total: p.total ?? 'E',
    };
  }).filter(r => r.golfer);

  const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });

  console.log('Supabase status:', supabaseRes.status);
  console.log(`✅ Updated ${rows.length} golfer scores`);
  console.log('Top 5:', rows.slice(0, 5).map(r => `${r.position}. ${r.golfer} (${r.total})`).join(', '));
}

updateScores().catch(console.error);
