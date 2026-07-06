# Target: install dependencies
install:
	npm ci

#	Target: run eslint in all js files
lint:
	npx eslint .

#	Target: run app in browser
run:
	npm run dev

# Target: build project
build:
	npm run build