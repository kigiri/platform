esbuild index.jsx \
	--define:process.env.NODE_ENV='"production"' \
	--bundle \
	--splitting \
	--format=esm \
	--outdir=public/js