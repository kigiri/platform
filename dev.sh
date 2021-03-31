cd worker
trap 'kill $!' 9 3 2 15
wrangler dev & esbuild ../index.jsx \
	--define:process.env.NODE_ENV='"developement"' \
	--format=esm \
	--bundle \
	--servedir=../public \
	--outdir=../public/js
