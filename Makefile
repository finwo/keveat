

.PHONY: docs
docs: docs/dht

docs/dht:
	pnpm --prefix dht install
	pnpm --prefix dht run build:docs
	cp -r dht/docs docs/dht

.PHONY: clean
clean:
	rm -rf docs/dht
