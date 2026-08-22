export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'Database configuration missing.' });
  }

  try {
    const { id, init } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing client id.' });
    }

    const now = Math.floor(Date.now() / 1000);
    const twoMinutesAgo = now - 120;
    
    // Get current year and month for monthly stats
    const dateObj = new Date();
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    // Prepare pipeline commands
    const pipeline = [
      ['ZADD', 'pf:active_users', now.toString(), id],
      ['ZREMRANGEBYSCORE', 'pf:active_users', '-inf', twoMinutesAgo.toString()],
      ['ZCARD', 'pf:active_users']
    ];

    // If it's a new page load session, we increment pageviews
    if (init === 'true') {
      pipeline.push(['INCR', 'pf:total_pageviews']);
      pipeline.push(['INCR', `pf:pageviews:${monthKey}`]);
      pipeline.push(['SADD', 'pf:unique_visitors', id]);
      pipeline.push(['SCARD', 'pf:unique_visitors']);
    } else {
      // Just fetch the existing total values so we can return them
      pipeline.push(['GET', 'pf:total_pageviews']);
      pipeline.push(['GET', `pf:pageviews:${monthKey}`]);
      pipeline.push(['SCARD', 'pf:unique_visitors']);
    }

    // Call Upstash Redis REST API
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pipeline)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Upstash error: ${errText}`);
    }

    const results = await response.json();

    // Map the results of the pipeline
    // results structure: [ { result: ... }, { result: ... }, ... ]
    const activeUsers = results[2].result || 0;
    
    // If init was true, results[3] is the INCR result (number)
    // If init was false, results[3] is the GET result (string or null)
    const rawTotalViews = results[3].result;
    const totalViews = rawTotalViews ? parseInt(rawTotalViews, 10) : 0;

    const rawMonthlyViews = results[4].result;
    const monthlyViews = rawMonthlyViews ? parseInt(rawMonthlyViews, 10) : 0;

    const uniqueVisitors = results[6]?.result || 0;

    return res.status(200).json({
      activeUsers,
      totalViews,
      monthlyViews,
      uniqueVisitors
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
