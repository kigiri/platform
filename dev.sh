cd worker
trap 'kill $!' 9 3 2 15
sh -c 'sleep 3; curl http://127.0.0.1:8787/ping'&
wrangler dev & esbuild ../index.jsx \
	--define:process.env.NODE_ENV='"developement"' \
	--format=esm \
	--bundle \
	--servedir=../public \
	--outdir=../public/js
